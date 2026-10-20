import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("notification delivery is private, deduplicated, consent-aware and atomic", async()=>{
  const db=await migratedDatabase();
  const user="00000000-0000-0000-0000-000000000221", outsider="00000000-0000-0000-0000-000000000222";
  try {
    await db.query("insert into auth.users(id) values($1),($2)",[user,outsider]);
    await asRole(db,"authenticated",user,async()=>{
      await db.query("insert into bhk_notification_preferences(user_id,marketing_in_app) values($1,false)",[user]);
      await assert.rejects(db.query("select bhk_deliver_notifications()"),/permission denied/i);
      await assert.rejects(db.query("insert into bhk_notification_outbox(user_id,event_key,category,title,body) values($1,'fake','transactional','Fake','Fake')",[user]),/permission denied/i);
    });
    await asRole(db,"authenticated",outsider,async()=>{
      assert.equal((await db.query("select * from bhk_notification_preferences")).rows.length,0);
      await assert.rejects(db.query("insert into bhk_notification_preferences(user_id) values($1)",[user]),/policy|security/i);
    });
    await asRole(db,"service_role",null,async()=>{
      for(const [key,category] of [["booking:1","transactional"],["search:1","marketing"]]) {
        await db.query("insert into bhk_notification_outbox(user_id,event_key,category,title,body,href) values($1,$2,$3,'Update','Details','/trips') on conflict(user_id,event_key) do nothing",[user,key,category]);
      }
      await db.query("insert into bhk_notification_outbox(user_id,event_key,category,title,body) values($1,'booking:1','transactional','Duplicate','Duplicate') on conflict(user_id,event_key) do nothing",[user]);
      let result=(await db.query("select bhk_deliver_notifications() result")).rows[0].result;
      assert.deepEqual(result,{delivered:1,suppressed:1,failed:0});
      assert.equal((await db.query("select bhk_deliver_notifications() result")).rows[0].result.delivered,0);
      assert.equal((await db.query("select * from bhk_notifications where user_id=$1",[user])).rows.length,1);
      await db.query("insert into bhk_notification_outbox(user_id,event_key,category,title,body,expires_at) values($1,'expired','transactional','Expired','Expired',now()-interval '1 minute')",[user]);
      await db.query("select bhk_deliver_notifications()");
      assert.equal((await db.query("select status from bhk_notification_outbox where event_key='expired'")).rows[0].status,"expired");
    });
    await asRole(db,"authenticated",user,async()=>{
      assert.equal((await db.query("select * from bhk_notification_outbox")).rows.length,0);
      await assert.rejects(db.query("update bhk_notification_preferences set timezone='Invalid/Timezone'"),/Unknown timezone/);
      await db.query("update bhk_notification_preferences set marketing_in_app=true,quiet_start='00:00',quiet_end='23:59:59'");
    });
    await asRole(db,"service_role",null,async()=>{
      await db.query("insert into bhk_notification_outbox(user_id,event_key,category,title,body) values($1,'quiet','marketing','Quiet','Quiet')",[user]);
      assert.equal((await db.query("select bhk_deliver_notifications() result")).rows[0].result.delivered,0);
      assert.equal((await db.query("select status,attempts from bhk_notification_outbox where event_key='quiet'")).rows[0].attempts,0);
    });
  } finally { await db.close(); }
});
